import 'jest';
import { Router } from '../../src/media/Router';
import MediaService from '../../src/MediaService';
import Room from '../../src/Room';
import { Peer } from '../../src/Peer';
import MediaNode from '../../src/media/MediaNode';

describe('MediaService', () => {
	let mediaService: MediaService;

	beforeEach(() => {
		mediaService = new MediaService();
		mediaService.mediaNodes.clear(); // We don't want nodes from config
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('Has correct properties', () => {
		expect(mediaService.closed).toBe(false);
	});

	it('close()', () => {
		mediaService.close();
		expect(mediaService.closed).toBe(true);
		expect(mediaService.mediaNodes.length).toBe(0);
	});

	describe('Router', () => {
		const ERROR_MSG_NO_MEDIA_NODES = 'no media nodes available';
		const ERROR_MSG_ROOM_CLOSED = 'room closed';
		let fakeMediaNode1: MediaNode;
		let fakeMediaNode2: MediaNode;
		let mockGetRouter1: jest.SpyInstance;
		let mockGetRouter2: jest.SpyInstance;
		let spyMediaNode1GetRouter: jest.SpyInstance;
		let spyMediaNode2GetRouter: jest.SpyInstance;
		let fakeRoom: Room;
		let fakePeer: Peer;
		let spyRoomAddRouter: jest.SpyInstance;

		beforeEach(() => {
			mockGetRouter1 = jest.fn().mockImplementation(async () => {	
				return { close: jest.fn() } as unknown as Router;
			});
			mockGetRouter2 = jest.fn().mockImplementation(async () => {	
				return { close: jest.fn() } as unknown as Router;
			});
			fakeRoom = {
				id: 'id',
				parentClose: false,
				addRouter: jest.fn()
			} as unknown as Room;
			fakePeer = {
				id: 'id'
			} as unknown as Peer;
			fakeMediaNode1 = {
				getRouter: mockGetRouter1
			} as unknown as MediaNode;
			fakeMediaNode2 = {
				getRouter: mockGetRouter2
			} as unknown as MediaNode;
			spyRoomAddRouter = jest.spyOn(fakeRoom, 'addRouter');
			spyMediaNode1GetRouter = jest.spyOn(fakeMediaNode1, 'getRouter');
			spyMediaNode2GetRouter = jest.spyOn(fakeMediaNode2, 'getRouter');
		});

		it('getRouter() - Should add router to room when parent not closed', async () => {
			mediaService.mediaNodes.add(fakeMediaNode1);
			expect(mediaService.mediaNodes.length).toBe(1);
			
			await mediaService.getRouter(fakeRoom, fakePeer);

			expect(spyRoomAddRouter).toHaveBeenCalled();
		});
		
		it('getRouter() - Should throw when parent room have closed', async () => {
			const roomWithClosedParent = { ...fakeRoom, parentClosed: true } as unknown as Room;

			mediaService.mediaNodes.add(fakeMediaNode1);
			
			await expect(mediaService.getRouter(roomWithClosedParent, fakePeer)).
				rejects.toThrowError(ERROR_MSG_ROOM_CLOSED);
			expect(spyRoomAddRouter).not.toHaveBeenCalled();
		});
		
		it('getRouter() - Should spread routers across mediaNodes', async () => {
			mediaService.mediaNodes.add(fakeMediaNode1);
			mediaService.mediaNodes.add(fakeMediaNode2);
			
			mediaService.getRouter(fakeRoom, fakePeer);
			mediaService.getRouter(fakeRoom, fakePeer);

			expect(spyMediaNode1GetRouter).toHaveBeenCalledTimes(1);
			expect(spyMediaNode2GetRouter).toHaveBeenCalledTimes(1);
		});
		
		// This needs to be last since index is set to NaN
		it('getRouter() - Should throw on no mediaNodes', async () => {
			await expect(mediaService.getRouter(fakeRoom, fakePeer)).
				rejects.toThrowError(ERROR_MSG_NO_MEDIA_NODES);
		});
	});
});